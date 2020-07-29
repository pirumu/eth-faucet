(function () {
    'use strict';

    window.addEventListener('load', function () {
      // Fetch all the forms we want to apply custom Bootstrap validation styles to
      var forms = document.getElementsByClassName('needs-validation');

      // Loop over them and prevent submission
      var validation = Array.prototype.filter.call(forms, function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            event.stopPropagation();
          if (form.checkValidity() === true) {
                $('#loading').css('display','block');
              
                let data = {
                  to_address:$('#to_address').val() ,
                  coin_type: $('#coin_id').val() 
                };

                $.ajax({
                    type: "POST",
                    url: "/raw-transaction",
                    data: data,
                    success: function(response){
                        $('#loading').css('display','none');
                        if(response.coin_type == 'eth' || 'usdt') {
                        let tpl =`<li class="list-group-item d-flex justify-content-between lh-condensed">
                                <div>
                                  <h6 class="my-0">
                                    <img src="${response.icon}" width="20px" />
                                    ${response.name} <i>${new Date()}</i>
                                    </h6>
                                      <a target="_blank" href="https://ropsten.etherscan.io/tx/${response.hash}">
                                    ${response.hash}
                                  </a>
                                </div>
                              </li>`;
                            $('#transactions').prepend($(tpl));
                        }
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        $('#loading').css('display','none');
                        $('#alert-error').css('display','block');
                    }
                  });

          }
          form.classList.add('was-validated');
        }, false);
      });
    
    }, false);
  })();


  $(function() {

    const getBalance = function() {
        $.get("/balance", function( data ) {
             if(data)
             {
               $('#eth-balance').text(data.eth);
               $('#usdt-balance').text(data.usdt);
               $('#btc-balance').text(data.btc);
               $('#bch-balance').text(data.bch);
             }

        });
    }
    getBalance();
  });